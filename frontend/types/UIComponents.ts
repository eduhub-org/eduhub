export interface SelectOption {
  key: number;
  label: string;
}

export interface CourseListFilterOptions {
  courseTitle: string;
  programId: number;
}

export interface StaticComponentProperty {
  key: number;
  label?: string;
  selected?: boolean;
}

export interface TextBoxProperties {
  key: number;
  placeHolder?: string;
  text?: string;
  debounceTime?: number;
  onChangeHandler: (key: number, value: string) => void;
  disabled?: boolean;
}

export interface ValueComment {
  _typename?: string;
  value: string;
  comment: string;
}

export interface SelectComponentProperty {
  componentID: number;
  options: ValueComment[];
  onChangeHandler: (componentId: number, value: string) => any;
}
