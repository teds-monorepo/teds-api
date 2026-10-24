import { z } from 'zod';

export const freeGameSchema = z.object({
  title: z.string(),
  image: z.string(),
  url: z.string(),
  originalPrice: z.string(),
  endDate: z.string().optional(),
  store: z.enum(['epic', 'steam']),
});

export type FreeGame = z.infer<typeof freeGameSchema>;

const epicOfferSchema = z.object({
  discountSetting: z.object({ discountPercentage: z.number().nullish() }).nullish(),
  startDate: z.string(),
  endDate: z.string(),
});

const epicElementSchema = z.object({
  title: z.string().nullish(),
  keyImages: z.array(z.object({ type: z.string(), url: z.string() })).nullish(),
  catalogNs: z
    .object({ mappings: z.array(z.object({ pageSlug: z.string() })).nullish() })
    .nullish(),
  offerMappings: z.array(z.object({ pageSlug: z.string() })).nullish(),
  productSlug: z.string().nullish(),
  urlSlug: z.string().nullish(),
  price: z
    .object({
      totalPrice: z
        .object({ fmtPrice: z.object({ originalPrice: z.string() }).nullish() })
        .nullish(),
    })
    .nullish(),
  promotions: z
    .object({
      promotionalOffers: z
        .array(z.object({ promotionalOffers: z.array(epicOfferSchema) }))
        .nullish(),
      upcomingPromotionalOffers: z
        .array(z.object({ promotionalOffers: z.array(epicOfferSchema) }))
        .nullish(),
    })
    .nullish(),
});

const epicResponseSchema = z.object({
  data: z
    .object({
      Catalog: z
        .object({
          searchStore: z.object({ elements: z.array(epicElementSchema).optional() }).optional(),
        })
        .optional(),
    })
    .optional(),
});

const STEAM_SEARCH_URL =
  'https://store.steampowered.com/search/?specials=1&maxprice=free&category1=998';

const EPIC_URL =
  'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function fetchFreeGames(): Promise<{
  epic: FreeGame[];
  steam: FreeGame[];
  errors: { store: string; message: string }[];
}> {
  const [epic, steam] = await Promise.allSettled([fetchEpicFreeGames(), fetchSteamFreeGames()]);

  if (epic.status === 'rejected' && steam.status === 'rejected') {
    throw new Error(
      `Both stores failed: epic=${errorMessage(epic.reason)}, steam=${errorMessage(steam.reason)}`
    );
  }

  const errors = [
    epic.status === 'rejected' ? { store: 'epic', message: errorMessage(epic.reason) } : null,
    steam.status === 'rejected' ? { store: 'steam', message: errorMessage(steam.reason) } : null,
  ].filter((entry) => entry !== null);

  return {
    epic: epic.status === 'fulfilled' ? epic.value : [],
    steam: steam.status === 'fulfilled' ? steam.value : [],
    errors,
  };
}

async function fetchEpicFreeGames(): Promise<FreeGame[]> {
  const response = await fetch(EPIC_URL);
  if (!response.ok) throw new Error(`Epic API returned ${response.status}`);

  const payload = epicResponseSchema.parse(await response.json());
  const elements = payload.data?.Catalog?.searchStore?.elements ?? [];
  const now = new Date();
  const games: FreeGame[] = [];

  for (const element of elements) {
    const current = element.promotions?.promotionalOffers?.[0]?.promotionalOffers ?? [];
    const upcoming = element.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers ?? [];
    const activeOffer = [...current, ...upcoming].find((offer) => {
      if (offer.discountSetting?.discountPercentage !== 0) return false;
      return now >= new Date(offer.startDate) && now <= new Date(offer.endDate);
    });
    if (!activeOffer) continue;

    const slug =
      element.catalogNs?.mappings?.[0]?.pageSlug ??
      element.offerMappings?.[0]?.pageSlug ??
      element.productSlug ??
      element.urlSlug ??
      '';

    games.push({
      title: element.title ?? 'Unknown',
      image:
        imageOfType(element, 'OfferImageWide') ??
        imageOfType(element, 'Thumbnail') ??
        element.keyImages?.[0]?.url ??
        '',
      url: slug
        ? `https://store.epicgames.com/en-US/p/${slug}`
        : 'https://store.epicgames.com/en-US/free-games',
      originalPrice: element.price?.totalPrice?.fmtPrice?.originalPrice ?? '',
      endDate: activeOffer.endDate,
      store: 'epic',
    });
  }

  return games;
}

async function fetchSteamFreeGames(): Promise<FreeGame[]> {
  const response = await fetch(STEAM_SEARCH_URL, { headers: BROWSER_HEADERS });
  if (!response.ok) throw new Error(`Steam search returned ${response.status}`);

  const html = await response.text();
  if (!html.includes('search_result_row')) {
    throw new Error(
      'Steam returned no result rows (likely blocked server-side request or changed markup).'
    );
  }
  const rowRegex =
    /<a[^>]*href="(https:\/\/store\.steampowered\.com\/app\/\d+\/[^"]*)"[^>]*class="search_result_row[^"]*"[^>]*>[\s\S]*?<\/a>/g;

  const games: FreeGame[] = [];
  let match: RegExpExecArray | null;

  while ((match = rowRegex.exec(html)) !== null) {
    const block = match[0];
    const url = match[1];
    if (!url) continue;

    const discount = firstGroup(block.match(/discount_pct[^>]*>([^<]+)</));
    if (discount?.trim().replace(/[-%]/g, '') !== '100') continue;

    const title = firstGroup(block.match(/<span class="title">([^<]+)<\/span>/));

    games.push({
      title: title?.trim() ?? 'Unknown',
      image: (firstGroup(block.match(/<img[^>]*src="([^"]+)"/)) ?? '').replace(
        /capsule_sm_120/,
        'header'
      ),
      url,
      originalPrice:
        firstGroup(block.match(/discount_original_price[^>]*>([^<]+)<\/span>/))?.trim() ?? '',
      store: 'steam',
    });
  }

  return games;
}

type EpicElement = z.infer<typeof epicElementSchema>;

function imageOfType(element: EpicElement, type: string): string | undefined {
  return element.keyImages?.find((image) => image.type === type)?.url;
}

function firstGroup(match: RegExpMatchArray | null): string | null {
  return match?.[1] ?? null;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
