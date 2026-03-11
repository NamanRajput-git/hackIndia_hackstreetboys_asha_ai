"""Add AI chat history table for voice interactions

Revision ID: 003_add_ai_chat_history
Revises: 002_add_visits_table
Create Date: 2024-02-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '003_add_ai_chat_history'
down_revision = '002_add_visits_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create ai_chat_history table for storing voice/chat interactions
    op.create_table(
        'ai_chat_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_message', sa.Text(), nullable=False),
        sa.Column('ai_response', sa.Text(), nullable=False),
        sa.Column('language_used', sa.String(10), server_default='hi'),
        sa.Column('is_emergency', sa.Boolean(), server_default='false'),
        sa.Column('intent', sa.String(50), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('audio_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('transcription_confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.id'], ondelete='SET NULL'),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_ai_chat_history_user_id', 'ai_chat_history', ['user_id'])
    op.create_index('ix_ai_chat_history_beneficiary_id', 'ai_chat_history', ['beneficiary_id'])
    op.create_index('ix_ai_chat_history_is_emergency', 'ai_chat_history', ['is_emergency'])
    op.create_index('ix_ai_chat_history_created_at', 'ai_chat_history', ['created_at'])


def downgrade():
    op.drop_index('ix_ai_chat_history_created_at', 'ai_chat_history')
    op.drop_index('ix_ai_chat_history_is_emergency', 'ai_chat_history')
    op.drop_index('ix_ai_chat_history_beneficiary_id', 'ai_chat_history')
    op.drop_index('ix_ai_chat_history_user_id', 'ai_chat_history')
    op.drop_table('ai_chat_history')
