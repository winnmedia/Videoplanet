// Public API for sign-up feature
export { signUpApi, handleSignUpError } from './api/sign-up.api'
export type {
  SignupData,
  AuthResponse,
  User,
  EmailAuthData,
  SendAuthNumberData,
  SignUpState,
  SignupFormProps,
  EmailVerificationProps,
  SignUpContextType,
  ApiError,
  FormValidationError,
  ValidationResult,
  TermsAgreement
} from './model/types'