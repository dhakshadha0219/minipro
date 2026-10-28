from fastapi import APIRouter, HTTPException
from schemas import LoginRequest, TwoFactorRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory prototype store for OTPs
DEMO_OTP = "123456"

@router.post("/login")
def login(req: LoginRequest):
    # Accept any reasonable input or demo credentials
    if req.email and len(req.password) >= 4:
        return {
            "status": "requires_2fa",
            "message": "Credentials valid. Please enter Two-Factor Authentication OTP code.",
            "email": req.email,
            "demo_otp_hint": "For prototype demonstration, use OTP code: 123456"
        }
    raise HTTPException(status_code=400, detail="Invalid email or password (min 4 chars)")

@router.post("/verify-2fa")
def verify_2fa(req: TwoFactorRequest):
    # For prototype testing, accept 123456 or any 6 digit code
    if req.code == DEMO_OTP or (len(req.code) == 6 and req.code.isdigit()):
        return {
            "status": "authenticated",
            "token": "demo_jwt_token_food_dehydration_digital_twin_2026",
            "user": {
                "name": "Biotech Admin",
                "email": req.email,
                "role": "Lead Process Engineer",
                "institution": "Commercial Dehydration Facility"
            }
        }
    raise HTTPException(status_code=400, detail="Invalid OTP verification code. Hint: Use 123456")
