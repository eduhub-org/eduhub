import styles from './shared-components.module.css';

/* eslint-disable-next-line */
export interface SharedComponentsProps {}

export function SharedComponents(props: SharedComponentsProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to SharedComponents!</h1>
    </div>
  );
}

export default SharedComponents;
