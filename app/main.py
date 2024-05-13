from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.api.wallets import router as wallet_router
from app.api.transactions import router as transaction_router
from app.db.session import create_tables

app = FastAPI()

# Create database tables
@app.on_event("startup")
def startup_event():
    create_tables()  # Pass the engine if needed, depending on your session.py setup

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Jinja2 Templates configuration
templates = Jinja2Templates(directory="app/templates")

# Include API routers
app.include_router(wallet_router, prefix="/api")
app.include_router(transaction_router, prefix="/api")

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/transaction-history/", response_class=HTMLResponse)
async def transaction_history(request: Request):
    print(request.__dict__, "--<<<<<<<<")
    wallet_id = request.query_params.get('walletId')
    if not wallet_id:
        return templates.TemplateResponse("error.html", {"request": request, "message": "No wallet selected."})
    return templates.TemplateResponse("transaction-history.html", {"request": request, "walletId": wallet_id})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
