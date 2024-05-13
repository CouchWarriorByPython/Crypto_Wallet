from sqlalchemy.orm import Session
from app.db.models import Transaction

def create_transaction(db: Session, transaction_data):
    transaction = Transaction(**transaction_data)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

def get_transaction(db: Session, transaction_id: str):
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()

def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Transaction).offset(skip).limit(limit).all()

def update_transaction(db: Session, transaction_id: str, updates):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if transaction:
        for var, value in updates.items():
            setattr(transaction, var, value)
        db.commit()
        db.refresh(transaction)
    return transaction

def delete_transaction(db: Session, transaction_id: str):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if transaction:
        db.delete(transaction)
        db.commit()
    return transaction
