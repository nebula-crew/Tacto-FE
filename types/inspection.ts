export type InspectionStatus = 'suspected' | 'normal' | 'hold';
export type CheckStatus = InspectionStatus | 'not_applicable';
export type Coords = { lat: number; lng: number };
export type Photo = { uri: string; name: string; mimeType: string; file?: File };
export type Inspection = { id: string; status: InspectionStatus; summary: string; checks: { code: string; title: string; status: CheckStatus; detail: string }[] };
