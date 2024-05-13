from fastapi import APIRouter, Depends, HTTPException
from requests import Session as RequestSession
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.wallet import (
    Wallet_Checker,
    WalletCreate,
    TopUpRequest,
    ConvertRequest,
    SendCurrencyRequest,
)
from app.crud.crud_wallet import create_wallet, get_wallet, get_wallets
from sqlalchemy.exc import IntegrityError
from app.db.models import Wallet
from app.crud.crud_transaction import create_transaction
from requests.exceptions import ConnectionError, Timeout, TooManyRedirects
from app.core.config import (
    API_KEY,
    MIN_COMMISSION_RATE,
    MID_COMMISSION_RATE,
    MAX_COMMISSION_RATE,
)
import json

router = APIRouter()


@router.post("/wallets/{wallet_id}/topup")
def top_up_wallet(wallet_id: str, request: TopUpRequest, db: Session = Depends(get_db)):
    wallet = get_wallet(db, wallet_id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    try:
        wallet.balance_usdt += request.amount
        db.commit()
        # Log the transaction
        create_transaction(
            db,
            {
                "wallet_id": wallet_id,
                "type": "topup",
                "amount_usdt": request.amount,
                "amount_btc": 0,
            },
        )

        return {
            "message": "Wallet topped up successfully",
            "balance_usdt": wallet.balance_usdt,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wallets/", response_model=Wallet_Checker)
def create_wallet_api(wallet_data: WalletCreate, db: Session = Depends(get_db)):
    try:
        return create_wallet(db=db, wallet_data=wallet_data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Wallet with this name already exists"
        )


@router.get("/wallets/", response_model=list[Wallet_Checker])
def read_wallets(db: Session = Depends(get_db)):
    return get_wallets(db)  # This function should return a list of wallet instances


@router.get("/wallets/{wallet_id}", response_model=Wallet_Checker)
def read_wallet(wallet_id: str, db: Session = Depends(get_db)):
    if not wallet_id or wallet_id == "undefined":
        raise HTTPException(status_code=404, detail="Invalid wallet ID provided")
    wallet = get_wallet(db, wallet_id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.post("/wallets/{wallet_id}/convert")
def convert_currency(
    wallet_id: str, request: ConvertRequest, db: Session = Depends(get_db)
):
    wallet = get_wallet(db, wallet_id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if wallet.balance_usdt < request.amount_usdt:
        raise HTTPException(status_code=400, detail="Insufficient USDT balance")

    coinmarket_url = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest"

    parameters = {"slug": "bitcoin", "convert": "USDT"}

    headers = {"Accepts": "application/json", "X-CMC_PRO_API_KEY": API_KEY}

    with RequestSession() as s:
        s.headers.update(headers)
    try:
        response = s.get(coinmarket_url, params=parameters)
        btc_price = json.loads(response.text)["data"]["1"]["quote"]["USDT"]["price"]
    except (ConnectionError, Timeout, TooManyRedirects) as e:
        print(e)

    amount_btc = round(request.amount_usdt / btc_price, 3)

    # Update wallet balances
    wallet.balance_usdt -= request.amount_usdt
    wallet.balance_btc += amount_btc
    db.commit()

    # Log the transaction
    create_transaction(
        db,
        {
            "wallet_id": wallet_id,
            "type": "convert",
            "amount_usdt": request.amount_usdt,
            "amount_btc": amount_btc,
        },
    )

    return {
        "message": "Currency converted successfully",
        "balance_usdt": wallet.balance_usdt,
        "balance_btc": wallet.balance_btc,
        "converted_btc": amount_btc,
    }


@router.post("/wallets/send")
def send_currency(request: SendCurrencyRequest, db: Session = Depends(get_db)):
    sender_wallet = db.query(Wallet).filter(Wallet.name == request.sender_name).first()
    recipient_wallet = (
        db.query(Wallet).filter(Wallet.name == request.recipient_name).first()
    )

    if not sender_wallet or not recipient_wallet:
        raise HTTPException(status_code=404, detail="One or more wallets not found")
    if sender_wallet.balance_btc < request.amount_btc:
        raise HTTPException(status_code=400, detail="Insufficient BTC balance")

    commission_rate = (
        MAX_COMMISSION_RATE
        if request.amount_btc <= 5
        else MID_COMMISSION_RATE
        if request.amount_btc <= 10
        else MIN_COMMISSION_RATE
    )
    commission_btc = request.amount_btc * commission_rate
    final_amount_btc = request.amount_btc - commission_btc

    sender_wallet.balance_btc -= request.amount_btc
    recipient_wallet.balance_btc += final_amount_btc
    db.commit()

    # Log the transaction for sender and receiver
    create_transaction(
        db,
        {
            "wallet_id": sender_wallet.id,
            "type": "send",
            "amount_btc": -request.amount_btc,
            "commission_btc": commission_btc,
            "recipient_id": recipient_wallet.id,
        },
    )
    create_transaction(
        db,
        {
            "wallet_id": recipient_wallet.id,
            "type": "receive",
            "amount_btc": final_amount_btc,
            "sender_id": sender_wallet.id,
        },
    )

    return {
        "message": "Funds sent successfully",
        "sender_balance_btc": sender_wallet.balance_btc,
        "commission_btc": commission_btc,
    }
