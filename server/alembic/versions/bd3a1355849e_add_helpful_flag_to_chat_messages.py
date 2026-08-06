"""add helpful flag to chat_messages

Revision ID: bd3a1355849e
Revises: d30fe87db3b8
Create Date: 2026-07-30 10:23:14.513661

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "bd3a1355849e"
down_revision: Union[str, Sequence[str], None] = "d30fe87db3b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("chat_messages", sa.Column("helpful", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_messages", "helpful")
