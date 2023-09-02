import { Currency } from 'src/infrastructure/enum/currency.enum';

export const OMG_PASS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
export const OMG_PASS_ITEM_NAME = 'OMG PASS 정기 구독';
export const OMG_PASS_ORDER_KAKAO_PREFIX = 'OMG_KAKAO_ORDER_';
export const OMG_PASS_USER_KAKAO_PREFIX = 'OMG_KAKAO_USER_';
export const OMG_PASS_USER_TOSS_PREFIX = 'OMG_TOSS_USER_';

export enum ItemName {
  OMG_PASS = 'omgPass',
  INJECT_TO_RANDOM_FRIENDS = 'injectToRandomFriends',
  INJECT_TO_CERTAIN_FRIEND = 'injectToCertainFriend',
  REVEAL_LAST_CHARACTER = 'revealLastCharacter',
}

export const ItemPrice = {
  [ItemName.OMG_PASS]: {
    currency: Currency.KRW,
    originalPrice: 3300,
    currentPrice: 1650,
    discountMessage: '지금은 런칭 할인이 적용되고 있어요.',
  },
  [ItemName.INJECT_TO_RANDOM_FRIENDS]: {
    currency: Currency.cookie,
    originalPrice: 100,
    currentPrice: 100,
  },
  [ItemName.INJECT_TO_CERTAIN_FRIEND]: {
    currency: Currency.cookie,
    originalPrice: 300,
    currentPrice: 300,
  },
  [ItemName.REVEAL_LAST_CHARACTER]: {
    currency: Currency.cookie,
    originalPrice: 400,
    currentPrice: 400,
  },
};
