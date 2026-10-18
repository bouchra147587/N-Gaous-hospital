import enum


class UserRole(str, enum.Enum):
    citizen = "citizen"
    admin = "admin"
    doctor = "doctor"


class AppointmentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    cancelled = "cancelled"
    completed = "completed"


class MessageStatus(str, enum.Enum):
    unread = "unread"
    read = "read"
    archived = "archived"
