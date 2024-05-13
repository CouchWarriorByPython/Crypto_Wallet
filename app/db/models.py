from sqlalchemy import Column, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    balance_usdt = Column(Float, default=0.0)
    balance_btc = Column(Float, default=0.0)
    # Relationships
    transactions = relationship("Transaction", foreign_keys="[Transaction.wallet_id]", back_populates="wallet")
    sent_transactions = relationship("Transaction", foreign_keys="[Transaction.sender_id]")
    received_transactions = relationship("Transaction", foreign_keys="[Transaction.recipient_id]")

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String, ForeignKey('wallets.id'), nullable=True)
    sender_id = Column(String, ForeignKey('wallets.id'), nullable=True)
    recipient_id = Column(String, ForeignKey('wallets.id'), nullable=True)
    type = Column(String)
    amount_usdt = Column(Float, default=0.0)
    amount_btc = Column(Float, default=0.0)
    commission_btc = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    # Back relationships
    wallet = relationship("Wallet", foreign_keys=[wallet_id], back_populates="transactions")
    sender_wallet = relationship("Wallet", foreign_keys=[sender_id])
    recipient_wallet = relationship("Wallet", foreign_keys=[recipient_id])
