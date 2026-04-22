export type RootStackParamList = {
  Main: undefined;
  AddTransaction: { id?: string; prefill?: { shoppingItemId?: string } } | undefined;
  NoteEditor: { id?: string; linkedTransactionId?: string; linkedDate?: string } | undefined;
  ShoppingEditor: { id?: string } | undefined;
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
  Settings: undefined;
};
