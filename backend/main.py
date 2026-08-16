"""
GeoScan / GEO-COMMAND — FastAPI Backend
Multi-Hazard Disaster Prediction Platform
Hackathon prototype: real auth + real RBAC, mocked hazard data.
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum as PyEnum
from typing import Any, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
import bcrypt as _bcrypt
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

# ─────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("GEOSCAN_SECRET_KEY", "geoscan-hackathon-secret-key-2026-meowiess")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./geoscan.db")

# ─────────────────────────────────────────────────────────────
# Database Setup
# ─────────────────────────────────────────────────────────────
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ─────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────
class RoleEnum(str, PyEnum):
    analyst = "analyst"
    coordinator = "coordinator"
    administrator = "administrator"
    pio = "pio"


class HazardTypeEnum(str, PyEnum):
    flood = "flood"
    wildfire = "wildfire"
    landslide = "landslide"
    cyclone = "cyclone"
    drought = "drought"


class SeverityEnum(str, PyEnum):
    low = "low"
    medium = "medium"
    high = "high"


class AlertStatusEnum(str, PyEnum):
    issued = "issued"
    overridden = "overridden"
    cancelled = "cancelled"


class SpoofResultEnum(str, PyEnum):
    blocked = "blocked"
    accepted = "accepted"


# ─────────────────────────────────────────────────────────────
# SQLAlchemy Models
# ─────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default=RoleEnum.analyst)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    alerts = relationship("Alert", back_populates="issuer")
    audit_entries = relationship("AuditLogEntry", back_populates="actor")


class Region(Base):
    __tablename__ = "regions"
    id = Column(String, primary_key=True)  # e.g. "kali-basin"
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    hazard_scores = relationship("HazardScore", back_populates="region")
    recommendations = relationship("Recommendation", back_populates="region")
    alerts = relationship("Alert", back_populates="region")
    spoof_events = relationship("SpoofEvent", back_populates="region")


class HazardScore(Base):
    __tablename__ = "hazard_scores"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    region_id = Column(String, ForeignKey("regions.id"), nullable=False)
    hazard_type = Column(String, nullable=False)
    probability = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    signals = Column(JSON, nullable=False, default=list)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    region = relationship("Region", back_populates="hazard_scores")


class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    region_id = Column(String, ForeignKey("regions.id"), nullable=False)
    hazard_type = Column(String, nullable=False)
    text = Column(Text, nullable=False)

    region = relationship("Region", back_populates="recommendations")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    region_id = Column(String, ForeignKey("regions.id"), nullable=False)
    hazard_type = Column(String, nullable=False)
    issued_by = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default=AlertStatusEnum.issued)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    region = relationship("Region", back_populates="alerts")
    issuer = relationship("User", back_populates="alerts")


class AuditLogEntry(Base):
    __tablename__ = "audit_log"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    actor_role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    detail = Column(JSON, nullable=True, default=dict)

    actor = relationship("User", back_populates="audit_entries")


class SpoofEvent(Base):
    __tablename__ = "spoof_events"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    region_id = Column(String, ForeignKey("regions.id"), nullable=False)
    claimed_value = Column(String, nullable=False)
    actual_value = Column(String, nullable=False)
    tile_hash = Column(String, nullable=False)
    hash_valid = Column(Boolean, nullable=False, default=False)
    result = Column(String, nullable=False, default=SpoofResultEnum.blocked)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    region = relationship("Region", back_populates="spoof_events")


# ─────────────────────────────────────────────────────────────
# Auth Utilities
# ─────────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ─────────────────────────────────────────────────────────────
# DB Dependency
# ─────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Auth Dependencies
# ─────────────────────────────────────────────────────────────
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*allowed_roles: str):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            role_names = " or ".join(r.capitalize() for r in allowed_roles)
            raise HTTPException(
                status_code=403,
                detail=f"Requires {role_names} role",
            )
        return current_user
    return checker


# ─────────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: RoleEnum = RoleEnum.analyst


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class HazardScoreOut(BaseModel):
    id: str
    hazard_type: str
    probability: float
    severity: str
    signals: list[str]
    updated_at: datetime

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: str
    hazard_type: str
    text: str

    class Config:
        from_attributes = True


class RegionListItem(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    highest_severity: str

    class Config:
        from_attributes = True


class RegionDetail(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    hazard_scores: list[HazardScoreOut]
    recommendations: list[RecommendationOut]

    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    text: str


class QueryResponse(BaseModel):
    matched_region_id: Optional[str]
    reason: str
    source: str = "keyword-matcher"


class AlertCreate(BaseModel):
    region_id: str
    hazard_type: HazardTypeEnum


class AlertPatch(BaseModel):
    status: AlertStatusEnum


class AlertOut(BaseModel):
    id: str
    region_id: str
    hazard_type: str
    issued_by: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: str
    timestamp: datetime
    actor_id: Optional[str]
    actor_role: str
    action: str
    detail: Optional[dict]

    class Config:
        from_attributes = True


class SpoofInjectRequest(BaseModel):
    region_id: str


class SpoofStepPayload(BaseModel):
    step: int
    message: str
    status: str  # "running" | "blocked"


class SpoofInjectResponse(BaseModel):
    spoof_event_id: str
    region_id: str
    tile_hash: str
    claimed_value: str
    actual_value: str
    result: str
    steps: list[SpoofStepPayload]


# ─────────────────────────────────────────────────────────────
# Seed Data
# ─────────────────────────────────────────────────────────────
DEMO_USERS = [
    {
        "name": "Dr. Shreya Wanjari",
        "email": "analyst@demo.io",
        "password": "Demo1234!",
        "role": RoleEnum.analyst,
    },
    {
        "name": "Mukund Chaurasiya",
        "email": "coordinator@demo.io",
        "password": "Demo1234!",
        "role": RoleEnum.coordinator,
    },
    {
        "name": "Director Neel Sankhe",
        "email": "admin@demo.io",
        "password": "Demo1234!",
        "role": RoleEnum.administrator,
    },
    {
        "name": "Priya Patel (PIO)",
        "email": "pio@demo.io",
        "password": "Demo1234!",
        "role": RoleEnum.pio,
    },
]

SEED_REGIONS = [
    {
        "id": "kali-basin",
        "name": "Kali River Basin",
        "lat": 15.24,
        "lng": 74.39,
        "hazards": [
            {
                "hazard_type": HazardTypeEnum.flood,
                "probability": 0.82,
                "severity": SeverityEnum.high,
                "signals": [
                    "SAR inundation +34% (Sentinel-1 pass #8841)",
                    "IMERG rainfall > 90th percentile (148mm/24h)",
                    "Soil moisture saturation: 94%",
                    "River discharge: +280% above monsoon baseline",
                ],
            },
            {
                "hazard_type": HazardTypeEnum.landslide,
                "probability": 0.21,
                "severity": SeverityEnum.low,
                "signals": [
                    "Slope saturation nominal — no InSAR creep detected",
                    "NDVI stable, no recent deforestation signature",
                ],
            },
        ],
        "recommendations": [
            {
                "hazard_type": HazardTypeEnum.flood,
                "text": "Evacuate low-lying wards near river km 12-18. Stage NDRF boats at Sector 4 Riverine Depot [15.24, 74.39]. Deploy 4x inflatable rescue craft.",
            }
        ],
    },
    {
        "id": "wayanad-hills",
        "name": "Wayanad Hill Complex",
        "lat": 11.61,
        "lng": 76.08,
        "hazards": [
            {
                "hazard_type": HazardTypeEnum.landslide,
                "probability": 0.77,
                "severity": SeverityEnum.high,
                "signals": [
                    "SMAP soil saturation: 95% — slope failure threshold exceeded",
                    "InSAR ground deformation: +12mm lateral creep (Meppadi sector)",
                    "GPM rainfall: 210mm in 48h — debris flow trigger exceeded",
                    "NDVI deficit: 18% canopy loss in upper catchment",
                ],
            },
            {
                "hazard_type": HazardTypeEnum.flood,
                "probability": 0.45,
                "severity": SeverityEnum.medium,
                "signals": [
                    "Chaliyar river discharge +140% above baseline",
                    "GPM accumulation: 210mm/48h",
                ],
            },
        ],
        "recommendations": [
            {
                "hazard_type": HazardTypeEnum.landslide,
                "text": "Immediate evacuation of Meppadi, Chooralmala, and Mundakkai settlements. Block NH766. Stage SDRF teams at Kalpetta helipad [11.61, 76.08].",
            }
        ],
    },
    {
        "id": "simlipal-forest",
        "name": "Simlipal Biosphere Reserve",
        "lat": 21.58,
        "lng": 86.27,
        "hazards": [
            {
                "hazard_type": HazardTypeEnum.wildfire,
                "probability": 0.71,
                "severity": SeverityEnum.high,
                "signals": [
                    "MODIS thermal anomaly: 44.8°C LST (36% above seasonal baseline)",
                    "VIIRS active fire pixels: 18 hotspots detected in 6h window",
                    "NDVI deficit: -0.23 indicating severe vegetation dryness",
                    "Wind direction: NE 28km/h — driving fire toward Baripada corridor",
                ],
            },
            {
                "hazard_type": HazardTypeEnum.drought,
                "probability": 0.38,
                "severity": SeverityEnum.medium,
                "signals": [
                    "SMAP soil moisture: 8.2% (below stress threshold of 12%)",
                    "Reservoir storage at 41% capacity",
                ],
            },
        ],
        "recommendations": [
            {
                "hazard_type": HazardTypeEnum.wildfire,
                "text": "Deploy ODRAF fire suppression units along NH18 firebreak. Evacuate Baripada fringe settlements. Pre-position water tankers at Jashipur depot [21.58, 86.27].",
            }
        ],
    },
    {
        "id": "paradip-coast",
        "name": "Paradip Coastal Delta",
        "lat": 20.31,
        "lng": 86.61,
        "hazards": [
            {
                "hazard_type": HazardTypeEnum.cyclone,
                "probability": 0.68,
                "severity": SeverityEnum.high,
                "signals": [
                    "INSAT-3D central pressure: 978 hPa (Category 2 threshold)",
                    "Maximum sustained wind: 115 km/h, gusts to 140 km/h",
                    "Predicted storm surge: 2.4m above MHWL at landfall",
                    "Bay of Bengal SST: 30.2°C — sustaining intensification",
                ],
            },
            {
                "hazard_type": HazardTypeEnum.flood,
                "probability": 0.55,
                "severity": SeverityEnum.medium,
                "signals": [
                    "Storm surge + tidal combination: coastal inundation risk",
                    "Mahanadi delta drainage: pre-saturated soils",
                ],
            },
        ],
        "recommendations": [
            {
                "hazard_type": HazardTypeEnum.cyclone,
                "text": "Mandatory evacuation of coastal wards within 5km of shoreline. Open 48 cyclone shelters (capacity: 82,000). Stage NDRF boats at Paradeep Port [20.31, 86.61].",
            }
        ],
    },
    {
        "id": "marathwada-basin",
        "name": "Marathwada Agricultural Basin",
        "lat": 18.39,
        "lng": 76.58,
        "hazards": [
            {
                "hazard_type": HazardTypeEnum.drought,
                "probability": 0.84,
                "severity": SeverityEnum.high,
                "signals": [
                    "SMAP root-zone soil moisture: 7.8% (critical stress threshold)",
                    "Jayakwadi reservoir: 12% capacity — lowest in 8 years",
                    "NDVI crop stress: Kharif yield forecast -42%",
                    "IMD SPI-3: -1.8 (severe drought category)",
                ],
            },
            {
                "hazard_type": HazardTypeEnum.wildfire,
                "probability": 0.18,
                "severity": SeverityEnum.low,
                "signals": [
                    "Dry biomass residue elevated post-harvest",
                    "No active fire pixels in 72h window",
                ],
            },
        ],
        "recommendations": [
            {
                "hazard_type": HazardTypeEnum.drought,
                "text": "Activate emergency water tanker program: 340 tankers to 1,200 villages. Trigger NREGA drought relief in Osmanabad, Latur, Nanded. Coordinate with Maharashtra Jeevan Authority [18.39, 76.58].",
            }
        ],
    },
    {
        "id": "teesta-gorge",
        "name": "Teesta River Basin & Glacial Lakes",
        "lat": 27.59,
        "lng": 88.61,
        "hazards": [
            {
                "hazard_type": HazardTypeEnum.flood,
                "probability": 0.63,
                "severity": SeverityEnum.high,
                "signals": [
                    "Sentinel-1 SAR: South Lhonak Lake moraine expansion +18m",
                    "GLOF risk: 107 million m³ potential outburst volume",
                    "GPM cloudburst: 89mm/6h over Chungthang catchment",
                    "Teesta discharge: +320% above baseline at Dikchu gauge",
                ],
            },
            {
                "hazard_type": HazardTypeEnum.landslide,
                "probability": 0.52,
                "severity": SeverityEnum.medium,
                "signals": [
                    "InSAR slope velocity: 4.2mm/day (NH10 corridor)",
                    "Saturated moraine material: high mass-movement potential",
                ],
            },
        ],
        "recommendations": [
            {
                "hazard_type": HazardTypeEnum.flood,
                "text": "Evacuate Chungthang, Singtam, and Rangpo riverside settlements. Open emergency spillways. Pre-position NDRF platoons at Gangtok base [27.33, 88.61]. Close NH10 to civilian traffic.",
            }
        ],
    },
]


def severity_order(s: str) -> int:
    return {"high": 3, "medium": 2, "low": 1}.get(s, 0)


def seed_database(db: Session) -> None:
    if db.query(User).count() > 0:
        return  # Already seeded

    print("\n" + "=" * 60)
    print("  GeoScan - Seeding demo database")
    print("=" * 60)

    # Seed users
    seeded_users: dict[str, User] = {}
    for u in DEMO_USERS:
        user = User(
            id=str(uuid.uuid4()),
            name=u["name"],
            email=u["email"],
            password_hash=hash_password(u["password"]),
            role=u["role"].value,
        )
        db.add(user)
        seeded_users[u["role"].value] = user
        print(f"  [OK] User: {u['email']}  |  password: {u['password']}  |  role: {u['role'].value}")

    # Seed regions + hazards + recommendations
    for rdata in SEED_REGIONS:
        region = Region(id=rdata["id"], name=rdata["name"], lat=rdata["lat"], lng=rdata["lng"])
        db.add(region)
        for h in rdata["hazards"]:
            db.add(
                HazardScore(
                    region_id=rdata["id"],
                    hazard_type=h["hazard_type"].value,
                    probability=h["probability"],
                    severity=h["severity"].value,
                    signals=h["signals"],
                )
            )
        for rec in rdata["recommendations"]:
            db.add(
                Recommendation(
                    region_id=rdata["id"],
                    hazard_type=rec["hazard_type"].value,
                    text=rec["text"],
                )
            )

    # Seed audit log
    sys_role = "administrator"
    sys_user = seeded_users.get(sys_role)
    base_time = datetime.now(timezone.utc) - timedelta(hours=2)
    seed_logs = [
        AuditLogEntry(
            timestamp=base_time,
            actor_id=seeded_users["analyst"].id,
            actor_role="analyst",
            action="queried_region",
            detail={"region_id": "kali-basin", "note": "Cross-modal flood risk assessment"},
        ),
        AuditLogEntry(
            timestamp=base_time + timedelta(minutes=7),
            actor_id=seeded_users["coordinator"].id,
            actor_role="coordinator",
            action="resource_staging_plan_dispatch",
            detail={"region_id": "kali-basin", "assets": "NDRF Platoon Delta, 4x rescue craft"},
        ),
        AuditLogEntry(
            timestamp=base_time + timedelta(minutes=15),
            actor_id=sys_user.id if sys_user else None,
            actor_role=sys_role,
            action="integrity_daemon_verified",
            detail={"note": "SHA-256 Merkle root OK across 6 active downlinks"},
        ),
    ]
    for log in seed_logs:
        db.add(log)

    db.commit()
    print("\n  [OK] Regions, hazards, and audit log seeded.")
    print("=" * 60 + "\n")


# ─────────────────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="GeoScan — Multi-Hazard Disaster Prediction API",
    description="Hackathon prototype backend. Real auth + RBAC, mocked hazard data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Auth Routes
# ─────────────────────────────────────────────────────────────
@app.post("/auth/register", response_model=UserOut, status_code=201, tags=["Auth"])
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
    )


@app.get("/auth/me", response_model=UserOut, tags=["Auth"])
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─────────────────────────────────────────────────────────────
# Region Routes
# ─────────────────────────────────────────────────────────────
@app.get("/regions", response_model=list[RegionListItem], tags=["Regions"])
def list_regions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    regions = db.query(Region).all()
    result = []
    for r in regions:
        scores = db.query(HazardScore).filter(HazardScore.region_id == r.id).all()
        if scores:
            best = max(scores, key=lambda s: severity_order(s.severity))
            highest = best.severity
        else:
            highest = "low"
        result.append(RegionListItem(id=r.id, name=r.name, lat=r.lat, lng=r.lng, highest_severity=highest))
    return result


@app.get("/regions/{region_id}", response_model=RegionDetail, tags=["Regions"])
def get_region(
    region_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    region = db.query(Region).filter(Region.id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    _write_audit(
        db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="queried_region",
        detail={"region_id": region_id},
    )
    return region


@app.get("/regions/{region_id}/hazards", response_model=list[HazardScoreOut], tags=["Regions"])
def get_region_hazards(
    region_id: str,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(HazardScore).filter(HazardScore.region_id == region_id)
    if type:
        q = q.filter(HazardScore.hazard_type == type)
    return q.all()


# ─────────────────────────────────────────────────────────────
# NL Query
# ─────────────────────────────────────────────────────────────
KEYWORD_MAP = {
    "kali-basin": ["kali", "basin", "sar", "inundation", "rainfall", "imerg", "river", "flood", "karnataka", "goa", "boat"],
    "wayanad-hills": ["wayanad", "kerala", "landslide", "slope", "soil", "saturation", "mudflow", "insar", "creep", "meppadi", "debris", "western ghats"],
    "simlipal-forest": ["simlipal", "forest", "wildfire", "fire", "thermal", "modis", "viirs", "ndvi", "dryness", "odisha", "canopy"],
    "paradip-coast": ["paradip", "cyclone", "coast", "surge", "wind", "insat", "pressure", "storm", "bay of bengal", "shelter", "barometric"],
    "marathwada-basin": ["marathwada", "drought", "aridity", "smap", "moisture", "crop", "reservoir", "tanker", "maharashtra", "agricultural"],
    "teesta-gorge": ["teesta", "glacial", "glof", "lake", "sikkim", "moraine", "cloudburst", "spillway", "flash flood", "sikkim"],
}


def keyword_match(text: str) -> tuple[Optional[str], str]:
    q = text.lower()
    best_id = None
    best_count = 0
    for region_id, keywords in KEYWORD_MAP.items():
        count = sum(1 for kw in keywords if kw in q)
        if count > best_count:
            best_count = count
            best_id = region_id
    if best_id and best_count > 0:
        return best_id, f"Keyword heuristic matched {best_id} ({best_count} signal terms)"
    return None, "No strong keyword match found; defaulting to most at-risk region"


@app.post("/query", response_model=QueryResponse, tags=["Query"])
def natural_language_query(
    body: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    region_id, reason = keyword_match(body.text)
    _write_audit(
        db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="nl_query",
        detail={"query": body.text[:200], "matched_region": region_id},
    )
    return QueryResponse(matched_region_id=region_id, reason=reason)


# ─────────────────────────────────────────────────────────────
# Alert Routes
# ─────────────────────────────────────────────────────────────
@app.post("/alerts", response_model=AlertOut, status_code=201, tags=["Alerts"])
def issue_alert(
    body: AlertCreate,
    current_user: User = Depends(require_role("administrator")),
    db: Session = Depends(get_db),
):
    region = db.query(Region).filter(Region.id == body.region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    alert = Alert(
        id=str(uuid.uuid4()),
        region_id=body.region_id,
        hazard_type=body.hazard_type.value,
        issued_by=current_user.id,
        status=AlertStatusEnum.issued.value,
    )
    db.add(alert)
    _write_audit(
        db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="issued_alert",
        detail={"region_id": body.region_id, "hazard_type": body.hazard_type.value, "alert_id": alert.id},
    )
    db.commit()
    db.refresh(alert)
    return alert


@app.patch("/alerts/{alert_id}", response_model=AlertOut, tags=["Alerts"])
def update_alert(
    alert_id: str,
    body: AlertPatch,
    current_user: User = Depends(require_role("administrator")),
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = body.status.value
    _write_audit(
        db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="alert_status_changed",
        detail={"alert_id": alert_id, "new_status": body.status.value},
    )
    db.commit()
    db.refresh(alert)
    return alert


@app.get("/alerts", response_model=list[AlertOut], tags=["Alerts"])
def list_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()


# ─────────────────────────────────────────────────────────────
# Spoof Demo
# ─────────────────────────────────────────────────────────────
@app.post("/spoof-demo/inject", response_model=SpoofInjectResponse, tags=["Spoof Demo"])
def inject_spoof(
    body: SpoofInjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    region = db.query(Region).filter(Region.id == body.region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    flood_score = (
        db.query(HazardScore)
        .filter(HazardScore.region_id == body.region_id, HazardScore.hazard_type == "flood")
        .first()
    )

    actual_pct = int((flood_score.probability if flood_score else 0.46) * 100)
    claimed_pct = max(10, actual_pct - 34)  # suppressed tile claims much lower
    tile_hash = f"a1F9{uuid.uuid4().hex[:8].upper()}"
    spoof_event_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    spoof_event = SpoofEvent(
        id=spoof_event_id,
        region_id=body.region_id,
        claimed_value=f"{claimed_pct}% inundation",
        actual_value=f"{actual_pct}% inundation",
        tile_hash=tile_hash,
        hash_valid=False,
        result=SpoofResultEnum.blocked.value,
        created_at=now,
    )
    db.add(spoof_event)

    steps = [
        ("hash_mismatch_detected", f"[STAGE 1] File SHA-256 {tile_hash}... checked against ESA Copernicus manifest — MISMATCH"),
        ("cross_checked_against_rainfall_implausible", f"[STAGE 2] Claimed {claimed_pct}% SAR inundation cross-checked vs IMERG rainfall record — IMPLAUSIBLE (rainfall >90th pct)"),
        ("tile_rejected", f"[STAGE 3] Rogue tile REJECTED. Restoring last verified Sentinel-1 SAR pass ({actual_pct}% inundation)"),
        ("forensic_report_logged", f"[STAGE 4] Forensic telemetry report generated & committed to cryptographic audit ledger — Event: {spoof_event_id[:8]}"),
    ]

    for i, (action_name, message) in enumerate(steps):
        db.add(
            AuditLogEntry(
                timestamp=now + timedelta(milliseconds=i * 200),
                actor_id=None,
                actor_role="system",
                action=action_name,
                detail={
                    "region_id": body.region_id,
                    "spoof_event_id": spoof_event_id,
                    "tile_hash": tile_hash,
                    "message": message,
                    "triggered_by": current_user.id,
                },
            )
        )

    db.commit()

    return SpoofInjectResponse(
        spoof_event_id=spoof_event_id,
        region_id=body.region_id,
        tile_hash=tile_hash,
        claimed_value=f"{claimed_pct}% inundation",
        actual_value=f"{actual_pct}% inundation",
        result="blocked",
        steps=[
            SpoofStepPayload(step=i + 1, message=msg, status="blocked" if i == len(steps) - 1 else "running")
            for i, (_, msg) in enumerate(steps)
        ],
    )


# ─────────────────────────────────────────────────────────────
# Audit Log
# ─────────────────────────────────────────────────────────────
@app.get("/audit-log", response_model=list[AuditLogOut], tags=["Audit"])
def get_audit_log(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(AuditLogEntry)
        .order_by(AuditLogEntry.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


# ─────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Meta"])
def health():
    return {"status": "ok", "service": "GeoScan Disaster Prediction API", "timestamp": datetime.now(timezone.utc).isoformat()}


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
def _write_audit(
    db: Session,
    *,
    actor_id: Optional[str],
    actor_role: str,
    action: str,
    detail: Optional[dict] = None,
) -> None:
    db.add(
        AuditLogEntry(
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            detail=detail or {},
        )
    )
    db.commit()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
