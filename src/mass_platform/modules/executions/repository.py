import json
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from mass_platform.modules.executions.models import Execution, ExecutionStatus


class Base(DeclarativeBase):
    pass


class ExecutionRow(Base):
    __tablename__ = "executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    generator: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    requested_by: Mapped[str] = mapped_column(String(120), nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    result_json: Mapped[str | None] = mapped_column(Text)
    error: Mapped[str | None] = mapped_column(Text)


class SqlExecutionRepository:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def save(self, execution: Execution) -> None:
        with self._session_factory.begin() as session:
            session.add(
                ExecutionRow(
                    id=str(execution.id),
                    generator=execution.generator,
                    status=execution.status.value,
                    requested_by=execution.requested_by,
                    requested_at=execution.requested_at,
                    result_json=json.dumps(execution.result) if execution.result else None,
                    error=execution.error,
                )
            )

    def get(self, execution_id: UUID) -> Execution | None:
        with self._session_factory() as session:
            row = session.get(ExecutionRow, str(execution_id))
            if row is None:
                return None
            return Execution(
                id=UUID(row.id),
                generator=row.generator,
                status=ExecutionStatus(row.status),
                requested_by=row.requested_by,
                requested_at=row.requested_at,
                result=json.loads(row.result_json) if row.result_json is not None else None,
                error=row.error,
            )


def create_database(url: str) -> tuple[sessionmaker[Session], object]:
    engine = create_engine(url, pool_pre_ping=True)
    return sessionmaker(engine, expire_on_commit=False), engine
