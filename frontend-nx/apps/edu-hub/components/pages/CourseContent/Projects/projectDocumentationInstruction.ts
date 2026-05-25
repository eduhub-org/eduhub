import { ProjectDocumentationInstructions_ProjectDocumentationInstruction } from '../../../../queries/__generated__/ProjectDocumentationInstructions';

export type ProjectDocumentationInstructionRow =
  ProjectDocumentationInstructions_ProjectDocumentationInstruction;

/** Only instructions with a stored PDF are selectable in course project UIs. */
export function filterProjectDocumentationInstructionsWithPdf<
  T extends Pick<ProjectDocumentationInstructionRow, 'url'>,
>(instructions: T[]): T[] {
  return instructions.filter((row) => Boolean(row.url?.trim()));
}
