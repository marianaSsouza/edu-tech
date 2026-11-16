import { User } from './acesso.entities';
import { Student, SchoolClass, PedagogicalContext, Enrollment, TeacherLink } from './escola.entities';
import { CatalogSkill } from './catalogo.entities';
import { CalendarEvent, Period, YearClosure } from './calendario.entities';
import { SequenceCounter, SkillResponse, WritingResponse, ResponseRevision, Observation } from './avaliacao.entities';
import { PedagogicalEvent } from './lacunas.entities';
import { ManualAttention, AttentionEvent } from './atencao.entities';

export * from './acesso.entities';
export * from './escola.entities';
export * from './catalogo.entities';
export * from './calendario.entities';
export * from './avaliacao.entities';
export * from './lacunas.entities';
export * from './atencao.entities';

export const ALL_ENTITIES = [
  User, Student, SchoolClass, PedagogicalContext, Enrollment, TeacherLink,
  CatalogSkill, Period, YearClosure, CalendarEvent,
  SequenceCounter, SkillResponse, WritingResponse, ResponseRevision, Observation,
  PedagogicalEvent, ManualAttention, AttentionEvent,
];
