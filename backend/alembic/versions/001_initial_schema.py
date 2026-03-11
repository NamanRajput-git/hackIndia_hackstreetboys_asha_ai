"""Initial schema for ASHA AI

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-02-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types
    op.execute("CREATE TYPE user_role AS ENUM ('beneficiary', 'asha_worker', 'partner', 'admin')")
    op.execute("CREATE TYPE user_type AS ENUM ('girl', 'pregnant', 'mother')")
    op.execute("CREATE TYPE anemia_status AS ENUM ('normal', 'mild', 'moderate', 'severe')")
    op.execute("CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high')")
    op.execute("CREATE TYPE economic_status AS ENUM ('bpl', 'apl')")
    op.execute("CREATE TYPE alert_severity AS ENUM ('medium', 'high', 'critical')")
    op.execute("CREATE TYPE alert_status AS ENUM ('open', 'resolved')")
    op.execute("CREATE TYPE alert_type AS ENUM ('sos', 'health_risk')")
    op.execute("CREATE TYPE scheme_provider AS ENUM ('Govt', 'NGO')")
    op.execute("CREATE TYPE scheme_category AS ENUM ('financial', 'nutrition', 'health')")
    op.execute("CREATE TYPE scheme_status AS ENUM ('active', 'draft', 'closed')")
    op.execute("CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed')")
    op.execute("CREATE TYPE mood_type AS ENUM ('Happy', 'Neutral', 'Sad', 'Tired', 'Anxious', 'Pain')")
    op.execute("CREATE TYPE gender_type AS ENUM ('male', 'female')")
    
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('role', postgresql.ENUM('beneficiary', 'asha_worker', 'partner', 'admin', name='user_role', create_type=False), nullable=True, server_default='beneficiary'),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('language', sa.String(10), nullable=True, server_default='hi'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create beneficiary_profiles table
    op.create_table('beneficiary_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('user_type', postgresql.ENUM('girl', 'pregnant', 'mother', name='user_type', create_type=False), nullable=True, server_default='pregnant'),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('height', sa.Numeric(5, 2), nullable=True),
        sa.Column('weight', sa.Numeric(5, 2), nullable=True),
        sa.Column('blood_group', sa.String(10), nullable=True),
        sa.Column('last_period_date', sa.Date(), nullable=True),
        sa.Column('pregnancy_stage', sa.String(50), nullable=True),
        sa.Column('pregnancy_week', sa.Integer(), nullable=True),
        sa.Column('edd', sa.Date(), nullable=True),
        sa.Column('anemia_status', postgresql.ENUM('normal', 'mild', 'moderate', 'severe', name='anemia_status', create_type=False), nullable=True, server_default='normal'),
        sa.Column('risk_level', postgresql.ENUM('low', 'medium', 'high', name='risk_level', create_type=False), nullable=True, server_default='low'),
        sa.Column('economic_status', postgresql.ENUM('bpl', 'apl', name='economic_status', create_type=False), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('gps_coords', postgresql.JSON(), nullable=True),
        sa.Column('linked_asha_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('next_checkup_date', sa.Date(), nullable=True),
        sa.Column('medical_history', sa.Text(), nullable=True),
        sa.Column('current_medications', sa.Text(), nullable=True),
        sa.Column('complications', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['linked_asha_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create schemes table
    op.create_table('schemes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('scheme_name', sa.String(255), nullable=False),
        sa.Column('provider', postgresql.ENUM('Govt', 'NGO', name='scheme_provider', create_type=False), nullable=False),
        sa.Column('category', postgresql.ENUM('financial', 'nutrition', 'health', name='scheme_category', create_type=False), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('hero_image', sa.Text(), nullable=True),
        sa.Column('benefits', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('eligibility_criteria', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('target_audience', postgresql.JSON(), nullable=True),
        sa.Column('status', postgresql.ENUM('active', 'draft', 'closed', name='scheme_status', create_type=False), nullable=True, server_default='active'),
        sa.Column('budget', sa.Numeric(15, 2), nullable=True, server_default='0'),
        sa.Column('enrolled_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('microsite_config', postgresql.JSON(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create children table
    op.create_table('children',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('dob', sa.Date(), nullable=True),
        sa.Column('gender', postgresql.ENUM('male', 'female', name='gender_type', create_type=False), nullable=True),
        sa.Column('blood_group', sa.String(10), nullable=True),
        sa.Column('vaccinations', postgresql.ARRAY(sa.String()), nullable=True),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create daily_logs table
    op.create_table('daily_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('mood', postgresql.ENUM('Happy', 'Neutral', 'Sad', 'Tired', 'Anxious', 'Pain', name='mood_type', create_type=False), nullable=True),
        sa.Column('symptoms', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('flow', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create health_logs table
    op.create_table('health_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('date', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('vitals', postgresql.JSON(), nullable=True),
        sa.Column('bp_systolic', sa.Integer(), nullable=True),
        sa.Column('bp_diastolic', sa.Integer(), nullable=True),
        sa.Column('symptoms', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('mood', sa.String(50), nullable=True),
        sa.Column('voice_note_url', sa.Text(), nullable=True),
        sa.Column('ai_summary', sa.Text(), nullable=True),
        sa.Column('is_emergency', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('visit_type', sa.String(50), nullable=True, server_default='home'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create alerts table
    op.create_table('alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', postgresql.ENUM('sos', 'health_risk', name='alert_type', create_type=False), nullable=False),
        sa.Column('severity', postgresql.ENUM('medium', 'high', 'critical', name='alert_severity', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('open', 'resolved', name='alert_status', create_type=False), nullable=True, server_default='open'),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('triggered_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['triggered_by'], ['users.id']),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create scheme_beneficiaries (enrollments) table
    op.create_table('scheme_beneficiaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('scheme_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrolled_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'approved', 'rejected', 'active', 'completed', name='enrollment_status', create_type=False), nullable=True, server_default='pending'),
        sa.Column('enrollment_date', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['enrolled_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('scheme_beneficiaries')
    op.drop_table('alerts')
    op.drop_table('health_logs')
    op.drop_table('daily_logs')
    op.drop_table('children')
    op.drop_table('schemes')
    op.drop_table('beneficiary_profiles')
    op.drop_table('users')
    
    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS gender_type")
    op.execute("DROP TYPE IF EXISTS mood_type")
    op.execute("DROP TYPE IF EXISTS enrollment_status")
    op.execute("DROP TYPE IF EXISTS scheme_status")
    op.execute("DROP TYPE IF EXISTS scheme_category")
    op.execute("DROP TYPE IF EXISTS scheme_provider")
    op.execute("DROP TYPE IF EXISTS alert_type")
    op.execute("DROP TYPE IF EXISTS alert_status")
    op.execute("DROP TYPE IF EXISTS alert_severity")
    op.execute("DROP TYPE IF EXISTS economic_status")
    op.execute("DROP TYPE IF EXISTS risk_level")
    op.execute("DROP TYPE IF EXISTS anemia_status")
    op.execute("DROP TYPE IF EXISTS user_type")
    op.execute("DROP TYPE IF EXISTS user_role")
