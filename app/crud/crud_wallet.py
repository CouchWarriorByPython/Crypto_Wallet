from sqlalchemy.orm import Session
from app.db.models import Wallet

def create_wallet(db: Session, wallet_data):
    wallet = Wallet(**wallet_data.dict())
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet

def get_wallet(db: Session, wallet_id: str):
    return db.query(Wallet).filter(Wallet.id == wallet_id).first()

def get_wallets(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Wallet).offset(skip).limit(limit).all()

def update_wallet(db: Session, wallet_id: str, updates):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    if wallet:
        for var, value in updates.items():
            setattr(wallet, var, value)
        db.commit()
        db.refresh(wallet)
    return wallet

def delete_wallet(db: Session, wallet_id: str):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    if wallet:
        db.delete(wallet)
        db.commit()
    return wallet
