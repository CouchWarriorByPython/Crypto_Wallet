from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TransactionBase(BaseModel):
    id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    amount_usdt: float
    amount_btc: float
    type: str
    created_at: datetime

    class Config:
        orm_mode = True

class TransactionCreate(TransactionBase):
    sender_id: Optional[str]
    recipient_id: Optional[str]

class Transaction(TransactionBase):
    sender_id: Optional[str]
    recipient_id: Optional[str]

    class Config:
        orm_mode = True