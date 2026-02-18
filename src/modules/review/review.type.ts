export interface CreateReview {
  comment: string;
  userId: string;
  productId: string;
  rating: number;
  isActive: boolean;
}
