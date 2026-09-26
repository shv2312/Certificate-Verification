from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, BigInteger, SmallInteger, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base

class Institution(Base):
    __tablename__ = "institutions"
    
    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(32), unique=True, index=True, nullable=False)
    admin_email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

class Student(Base):
    __tablename__ = "students"
    
    id = Column(BigInteger, primary_key=True, index=True)
    register_number = Column(String(30), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    full_name_normalized = Column(String(200), nullable=False)
    programme_id = Column(Integer, nullable=False)
    branch_id = Column(Integer, nullable=False)
    year_of_passing = Column(SmallInteger, nullable=False)
    university_name = Column(String(200), nullable=False, default="Anna University")
    institute_name = Column(String(200), nullable=False, default="Sri Shakthi Institute of Engineering and Technology")
    period_of_study_start = Column(SmallInteger, nullable=True)
    period_of_study_end = Column(SmallInteger, nullable=True)
    mode_of_education = Column(String(50), nullable=True)
    has_arrear = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    imported_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    institution_id = Column(String(64), ForeignKey("institutions.id"), index=True, nullable=True)

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
    hr_name = Column(String(255), nullable=True)
    hr_phone = Column(String(50), nullable=True)
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
    owner_id = Column(Integer, ForeignKey("admin_accounts.id"), nullable=True)
    payment_session_id = Column(String(64), unique=True, nullable=True)
    status = Column(String(32), default="PAID_UNUSED", nullable=False)
    company_name = Column(String(300), nullable=False)
    hr_email = Column(String(255), nullable=False)
    hr_name = Column(String(255), nullable=True)
    hr_phone = Column(String(50), nullable=True)
    
    # HR-submitted candidate details
    hr_submitted_name = Column(String(200), nullable=True)
    hr_submitted_register_number = Column(String(30), nullable=True)
    hr_submitted_programme = Column(String(100), nullable=True)
    hr_submitted_branch = Column(String(100), nullable=True)
    hr_submitted_year_of_passing = Column(SmallInteger, nullable=True)
    
    candidate_data = Column(Text)  # Stored as JSON string
    verification_result = Column(Text)  # Stored as JSON string
    institution_id = Column(String(64), ForeignKey("institutions.id"), index=True, nullable=True)
    certificate_url = Column(String(1024), nullable=True)
    admin_decision = Column(String(32), default="PENDING_REVIEW", nullable=False)
    admin_remarks = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String(255), nullable=True)

    created_at = Column(BigInteger, nullable=False)
    completed_at = Column(BigInteger, nullable=True)

