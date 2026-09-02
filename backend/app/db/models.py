from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func
from app.db.session import Base

class AdminAccount(Base):
    __tablename__ = "admin_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class EmailChallenge(Base):
    __tablename__ = "email_challenges"
    
    id = Column(String(64), primary_key=True, index=True)  # challenge_id
    email = Column(String(255), index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    otp_hmac = Column(String(64), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    last_sent_at = Column(Integer, nullable=False)  # Unix timestamp
    created_at = Column(Integer, nullable=False)    # Unix timestamp

class PaymentSession(Base):
    __tablename__ = "payment_sessions"
    
    id = Column(String(64), primary_key=True, index=True)  # payment_session_id
    gateway_order_id = Column(String(128))
    amount_paise = Column(Integer, nullable=False)
    status = Column(String(32), default="PAYMENT_PENDING", nullable=False)
    verification_request_id = Column(String(64))
    created_at = Column(Integer, nullable=False)

class VerificationRequest(Base):
    __tablename__ = "verification_requests"
    
    id = Column(String(64), primary_key=True, index=True)  # verification_request_id
    display_request_id = Column(String(32), unique=True, index=True, nullable=False)
    status = Column(String(32), default="PAID_UNUSED", nullable=False)
    company_name = Column(String(255), nullable=False)
    hr_email = Column(String(255), nullable=False)
    candidate_data = Column(Text)  # Stored as JSON string
    verification_result = Column(Text)  # Stored as JSON string
    created_at = Column(Integer, nullable=False)
