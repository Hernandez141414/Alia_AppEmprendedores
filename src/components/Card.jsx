import styles from './Card.module.css'

export default function Card({ nombre, descripcion, preview, onViewMore }) {
  return (
    <article className={styles.card}>
      <div className={styles['preview-wrapper']}>
        <img
          src={preview}
          alt={`Preview de ${nombre}`}
          className={styles.preview}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{nombre}</h3>
        <p className={styles.description}>{descripcion}</p>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          onClick={onViewMore}
          className={styles['cta-btn']}
        >
          Ver más
        </button>
      </div>
    </article>
  )
}
