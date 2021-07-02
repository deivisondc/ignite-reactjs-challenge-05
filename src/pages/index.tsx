import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

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
    <>
      <Header />
      <div className={styles.container}>
        <main>
          {posts.map(post => (
            <Link href={`/posts/${post.uid}`}>
              <div className={styles.post} key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>

                <footer>
                  <FiCalendar color="#BBBBBB" size={15} />
                  <span>{post.first_publication_date}</span>
                  <FiUser color="#BBBBBB" size={15} />
                  <span>{post.data.author}</span>
                </footer>
              </div>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </main>
      </div>
    </>
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
      uid: post.uid,
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
