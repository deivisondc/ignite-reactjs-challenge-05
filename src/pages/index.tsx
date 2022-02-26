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
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function handleLoadMorePosts(): void {
    if (nextPage) {
      fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          const nextPagePosts = data.results.map(post => {
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
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <div className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>

                <footer>
                  <FiCalendar color="#BBBBBB" size={15} />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'd MMM yyyy'
                    ).toLowerCase()}
                  </span>
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

      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 10,
      ref: previewData?.ref ?? null,
      orderings: '[document.first_publication_date]',
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
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
      preview,
    },
  };
};
