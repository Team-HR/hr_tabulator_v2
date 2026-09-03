export interface Criterion {
    id: number;
    name: string;
    weight: number;
}

export interface Event {
    id: number;
    name: string;
    icon: string | null;
    name_color: string | null;
    status: 'active' | 'in-active';
    criteria?: Criterion[];
    judges?: User[];
    scores?: Score[];
    contestants?: Contestant[];
    special_awards?: SpecialAward[];
}

export interface EventUser {
    id: number;
    event_id: number;
    user_id: number;
    scores?: Score[];
    event?: Event;
    criteria?: Criterion[];
    status: 'active' | 'in-active';
    // event?: Event;
}

export interface Contestant {
    id: number;
    event_id: number;
    name: string;
    sort_order: number;
    event?: Event;
    scores?: Score[];
    special_awards?: SpecialAward[];
}

export interface Score {
    id: number;
    event_id: number;
    event_user_id: number;
    contestant_id: number;
    criterion_id: number;
    judge_id: number;
    score: number | null;
    event?: Event;
    judge?: User;
    contestant?: Contestant;
    criterion?: Criterion;
}

export interface SpecialAward {
    id: number;
    title: string;
    description: string | null;
    event_id: number;
    contestant_id: number;
    status: 'active' | 'in-active';
    contestant?: Contestant;
    event?: Event;
}
