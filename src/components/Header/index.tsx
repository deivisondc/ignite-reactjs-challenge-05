import styles from './header.module.scss';

export default function Header() {
  return (
    <div className={styles.container}>
      <header>
        <img src="/images/logo.svg" alt="Logo" />
      </header>
    </div>
  );
}
