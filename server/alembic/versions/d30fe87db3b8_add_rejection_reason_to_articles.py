"""add rejection_reason to articles

Revision ID: d30fe87db3b8
Revises: b154f72fb92c
Create Date: 2026-07-30 09:30:03.633978

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d30fe87db3b8"
down_revision: Union[str, Sequence[str], None] = "b154f72fb92c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("articles", sa.Column("rejection_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("articles", "rejection_reason")
