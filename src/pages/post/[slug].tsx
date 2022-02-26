import { useEffect, useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
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
  last_publication_date: string | null;
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

interface FooterLink {
  slug: string;
  title: string;
}

interface PostProps {
  post: Post;
  previousPost?: FooterLink;
  nextPost?: FooterLink;
}

export default function Post({
  post,
  previousPost,
  nextPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const anchor = document.getElementById('inject-comments-for-uterances');
    if (anchor) {
      const script = document.createElement('script');
      script.setAttribute('src', 'https://utteranc.es/client.js');
      script.setAttribute('crossorigin', 'anonymous');
      script.setAttribute('async', 'true');
      script.setAttribute('repo', 'deivisondc/ignite-reactjs-challenge-05');
      script.setAttribute('issue-term', 'pathname');
      script.setAttribute('theme', 'github-light');
      anchor.appendChild(script);
    }
  }, []);

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
          <span>
            {format(
              new Date(post.first_publication_date),
              'd MMM yyyy'
            ).toLowerCase()}
          </span>
          <FiUser size={18} />
          <span>{post.data.author}</span>
          <FiClock size={18} />
          <span>{estimatedTimeReading} min</span>
        </div>
        {post.last_publication_date ? (
          <div className={styles.editInfo}>
            <span>
              * editado em{' '}
              {format(
                new Date(post.last_publication_date),
                "d MMM yyyy', às' HH:mm"
              ).toLowerCase()}
            </span>
          </div>
        ) : null}
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

        <hr className={styles.divisor} />

        <div className={styles.footer}>
          {previousPost?.slug ? (
            <Link href={`/post/${previousPost.slug}`}>
              <div>
                <p>{previousPost?.title}</p>
                <span>Post anterior</span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextPost?.slug ? (
            <Link href={`/post/${nextPost.slug}`}>
              <div>
                <p>{nextPost?.title}</p>
                <span>Próximo post</span>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </main>

      <div id="inject-comments-for-uterances"> </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  return {
    paths: posts.results.map(result => ({ params: { slug: result?.uid } })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  let previousPost;
  let nextPost;
  try {
    previousPost = (
      await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
        orderings: '[document.first_publication_date desc]',
        after: response.id,
        pageSize: 1,
      })
    ).results[0];

    nextPost = (
      await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
        after: response.id,
        orderings: '[document.first_publication_date]',
        pageSize: 1,
      })
    ).results[0];
  } catch {
    previousPost = { data: {} };
    nextPost = { data: {} };
  }
  // const nextPost = await prismic.getByUID('posts', String(slug), {
  //   after: String(slug),
  //   orderings: '[my.posts.first_publication_date]',
  // });

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        last_publication_date: response.last_publication_date,
        uid: response.uid,
        data: response.data,
      },
      previousPost: previousPost
        ? {
            slug: previousPost.uid,
            title: previousPost.data?.title,
          }
        : {},
      nextPost: nextPost
        ? {
            slug: nextPost.uid,
            title: nextPost.data?.title,
          }
        : {},
    },
    revalidate: 60 * 60 * 24,
  };
};
