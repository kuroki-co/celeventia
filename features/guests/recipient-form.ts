export type RecipientFormValues = {
  displayName: string;
  maxGuests: string;
  phone: string;
};

export type RecipientFieldErrors = Partial<
  Record<keyof RecipientFormValues, string>
>;

export function getRecipientFormValues(formData: FormData): RecipientFormValues {
  return {
    displayName: String(formData.get("displayName") ?? ""),
    maxGuests: String(formData.get("maxGuests") ?? "1"),
    phone: String(formData.get("phone") ?? ""),
  };
}

export function getRecipientFieldErrors(
  errors: Record<string, string[] | undefined>,
): RecipientFieldErrors {
  return {
    displayName: errors.displayName?.[0],
    maxGuests: errors.maxGuests?.[0],
    phone: errors.phone?.[0],
  };
}
