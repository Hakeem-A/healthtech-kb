"""migrate staff role to viewer

Revision ID: b154f72fb92c
Revises: fb58dc435f2d
Create Date: 2026-07-23 11:20:42.279901

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b154f72fb92c'
down_revision: Union[str, Sequence[str], None] = 'fb58dc435f2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET role='viewer' WHERE role='staff'")

def downgrade() -> None:
    op.execute("UPDATE users SET role='staff' WHERE role='viewer'")
