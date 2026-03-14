"""Add visits table for ASHA worker scheduling

Revision ID: 002_add_visits_table
Revises: initial
Create Date: 2024-02-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '002_add_visits_table'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create visits table
    op.create_table(
        'visits',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('asha_worker_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('scheduled_time', sa.String(20), nullable=True),
        sa.Column('visit_type', sa.String(50), server_default='routine_checkup'),
        sa.Column('purpose', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('scheduled', 'completed', 'cancelled', 'missed', name='visitstatus'), 
                  server_default='scheduled'),
        sa.Column('priority', sa.Enum('low', 'normal', 'high', 'urgent', name='visitpriority'), 
                  server_default='normal'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('health_log_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['asha_worker_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['health_log_id'], ['health_logs.id'], ondelete='SET NULL'),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_visits_beneficiary_id', 'visits', ['beneficiary_id'])
    op.create_index('ix_visits_asha_worker_id', 'visits', ['asha_worker_id'])
    op.create_index('ix_visits_scheduled_date', 'visits', ['scheduled_date'])
    op.create_index('ix_visits_status', 'visits', ['status'])


def downgrade():
    op.drop_index('ix_visits_status', 'visits')
    op.drop_index('ix_visits_scheduled_date', 'visits')
    op.drop_index('ix_visits_asha_worker_id', 'visits')
    op.drop_index('ix_visits_beneficiary_id', 'visits')
    op.drop_table('visits')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS visitstatus')
    op.execute('DROP TYPE IF EXISTS visitpriority')
