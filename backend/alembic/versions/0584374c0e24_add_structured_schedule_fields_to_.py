"""add structured schedule fields to doctors

Revision ID: 0584374c0e24
Revises: 531c3986184a
Create Date: 2026-09-28 10:31:39.755447

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0584374c0e24'
down_revision: Union[str, Sequence[str], None] = '531c3986184a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "doctors",
        sa.Column("schedule_days", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "doctors",
        sa.Column("schedule_start", sa.Time(), nullable=True),
    )
    op.add_column(
        "doctors",
        sa.Column("schedule_end", sa.Time(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("doctors", "schedule_end")
    op.drop_column("doctors", "schedule_start")
    op.drop_column("doctors", "schedule_days")