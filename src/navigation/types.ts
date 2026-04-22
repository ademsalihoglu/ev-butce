export type RootStackParamList = {
  Main: undefined;
  AddTransaction:
    | { id?: string; prefill?: { shoppingItemId?: string; ocr?: { amount?: number; date?: string } } }
    | undefined;
  NoteEditor: { id?: string; linkedTransactionId?: string; linkedDate?: string } | undefined;
  ShoppingEditor: { id?: string } | undefined;
  AssetEditor: { id?: string } | undefined;
  FamilyGroup: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TabsParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Shopping: undefined;
  Notes: undefined;
  Reports: undefined;
  Assets: undefined;
  Settings: undefined;
};
