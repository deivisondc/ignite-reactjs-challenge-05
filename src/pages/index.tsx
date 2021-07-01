import { useState } from 'react';
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
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function handleLoadMorePosts(): void {
    console.log('nextPage', nextPage);
    if (nextPage) {
      fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          const nextPagePosts = data.results.map(post => {
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

          setPosts([...posts, ...nextPagePosts]);
          setNextPage(data.next_page);
        })
        .catch(console.error);
    }
  }

  return (
    <div className={styles.container}>
      <header>
        <img src="/images/logo.svg" alt="Logo" />
      </header>

      <main>
        {posts.map(post => (
          <div className={styles.post} key={post.uid}>
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}</p>

            <footer>
              <img src="/images/calendar.svg" alt="Logo" />
              <span>{post.first_publication_date}</span>
              <img src="/images/user.svg" alt="Logo" />
              <span>{post.data.author}</span>
            </footer>
          </div>
        ))}

        {nextPage && (
          <button type="button" onClick={handleLoadMorePosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1 }
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
