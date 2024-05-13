from pydantic import BaseModel, Field
import uuid

class WalletBase(BaseModel):
    name: str = Field(..., example="John's Wallet")

class WalletCreate(WalletBase):
    pass

class Wallet_Checker(WalletBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), example="123e4567-e89b-12d3-a456-426614174000")
    balance_usdt: float = Field(default=0.0, example=1000.0)
    balance_btc: float = Field(default=0.0, example=2.5)

    class Config:
        orm_mode = True

class TopUpRequest(BaseModel):
    amount: float

class ConvertRequest(BaseModel):
    amount_usdt: float

class SendCurrencyRequest(BaseModel):
    sender_name: str
    recipient_name: str
    amount_btc: float