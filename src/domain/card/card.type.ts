export type CardBatchEndedEvent = {
  userId: string;
  cardBatchId: number;
  skippedCardCount: number;
};
