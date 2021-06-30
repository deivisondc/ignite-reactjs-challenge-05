import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  return (
    <div className={styles.container}>
      <header>
        <img src="/images/logo.svg" alt="Logo" />
      </header>

      <main>
        {postsPagination.results.map(post => (
          <div className={styles.post}>
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}</p>

            <footer>
              <span>{post.first_publication_date}</span>
              <span>{post.data.author}</span>
            </footer>
          </div>
        ))}

        <a href="/">Carregar mais posts</a>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 5 }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.id,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'd MMM yyyy'
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
