export interface RegisterV2Form {
  firstName: string;
  middleName: string;
  lastName: string;
  dialCode: string;
  phone: string;
  email: string;
  otp: string;
  username: string;
  password: string;
  acceptedTerms: boolean;
  interests: string[];
  currency: string;
  homeAirport: string;
}

export type RegisterV2Errors = Partial<Record<keyof RegisterV2Form, string>>;

export interface RegisterV2StepProps {
  form: RegisterV2Form;
  errors: RegisterV2Errors;
  update: (patch: Partial<RegisterV2Form>) => void;
}
