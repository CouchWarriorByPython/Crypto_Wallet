from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.transaction import Transaction, TransactionCreate  # Ensure these are Pydantic models
from app.crud.crud_transaction import create_transaction  # CRUD operations
from app.db.session import get_db  # Database session
from app.db.models import Transaction as DBTransaction

router = APIRouter()

@router.post("/transactions/", response_model=Transaction)
def create_transaction_endpoint(transaction: TransactionCreate, db: Session = Depends(get_db)):
    return create_transaction(db=db, transaction_data=transaction)


@router.get("/transactions/{wallet_id}", response_model=list[Transaction])
def read_transactions_by_wallet(wallet_id: str, db: Session = Depends(get_db)):
    transactions = db.query(DBTransaction).filter(DBTransaction.wallet_id == wallet_id).all()
    return transactions
