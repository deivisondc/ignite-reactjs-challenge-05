import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const estimatedTimeReading = useMemo(() => {
    if (!post) {
      return 0;
    }

    const words = post.data.content.reduce((acc, cur) => {
      const heading = cur.heading.split(' ').length;
      const body = RichText.asText(cur.body).split(' ').length;

      return acc + heading + body;
    }, 0);

    return Math.ceil(words / 200);
  }, [post]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <main className={styles.content}>
        <h1>{post.data.title}</h1>
        <div className={styles.postInfo}>
          <FiCalendar size={18} />
          <span>{post.first_publication_date}</span>
          <FiUser size={18} />
          <span>{post.data.author}</span>
          <FiClock size={18} />
          <span>{estimatedTimeReading} min</span>
        </div>
        {post.data.content.map(content => (
          <div key={content.heading}>
            <h2>{content.heading}</h2>
            <div
              key={content.heading}
              className="content"
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1 }
  );

  return {
    paths: [{ params: { slug: posts.results[0]?.uid } }],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', slug.toString(), {});

  console.log('response.data.content', response.data);

  return {
    props: {
      post: {
        first_publication_date: format(
          new Date(response.first_publication_date),
          'd MMM yyyy'
        ),
        data: response.data,
      },
    },
    revalidate: 60 * 60 * 24,
  };
};
