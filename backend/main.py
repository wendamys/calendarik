import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from database import get_db, engine
import models
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:63342", # Твой адрес из PyCharm
        "http://127.0.0.1:63342",
        "*"                       # Разрешить всем (на время разработки)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserSchema(BaseModel):
    first_name: str
    last_name: str

    class Config:
        from_attributes = True

class EventSchema(BaseModel):
    name: str
    event_start: datetime.datetime
    event_end: Optional[datetime.datetime] = None
    user_id: int

    class Config:
        from_attributes = True

@app.get("/events")
def get_all_events(db = Depends(get_db)):
    events = db.query(models.Event).all()
    return events

@app.post("/events")
def insert_event(event: EventSchema, db = Depends(get_db)):
    new_event = models.Event(**event.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.put("/events/{event_id}")
def change_event(event_id: int, update_data: EventSchema, db = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    update_data = update_data.model_dump()
    for key, value in update_data.items():
        setattr(db_event, key, value)

    db.commit()
    db.refresh(db_event)
    return {"message": f"Event {event_id} data refresh"}

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db = Depends(get_db)):
    event_to_delete = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event_to_delete:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event_to_delete)
    db.commit()

    return {"message": f"Event {event_id} deleted successfully"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()  # Принимаем соединение
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")

@app.get("/users")
def all_users(db = Depends(get_db)):
    user = db.query(models.User).all()
    return user
@app.post("/user")
def add_user(user: UserSchema, db = Depends(get_db)):
    new_user = models.User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user



@app.put("/users/{user_id}")
def change_user(user_id: int, update_data: UserSchema, db=Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = update_data.model_dump()
    for key, value in update_dict.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return {"message": f"User {user_id} updated successfully"}


@app.delete("/users/{user_id}")
def delete_user(user_id: int, db=Depends(get_db)):
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    # Удаляем все события пользователя
    db.query(models.Event).filter(models.Event.user_id == user_id).delete()
    # Удаляем пользователя
    db.delete(user_to_delete)
    db.commit()

    return {"message": f"User {user_id} deleted successfully"}
