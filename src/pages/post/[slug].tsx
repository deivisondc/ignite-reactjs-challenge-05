import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
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

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <main className={styles.content}>
        <h1>{post.data.title}</h1>
        {post.data.content.map(content => (
          <div>
            <h2>{content.heading}</h2>
            <div
              key={content.heading}
              className="content"
              dangerouslySetInnerHTML={{ __html: content.body }}
            />
          </div>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
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

export const getStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', slug, {});

  // const words = response.data.content.reduce((acc, cur) => {
  //   const heading = cur.heading.split(' ').length;
  //   const body = RichText.asText(cur.body).split(' ').length;

  //   return acc + heading + body;
  // }, 0);

  // const estimatedTimeReading = Math.ceil(words / 200);

  console.log(response.data);
  // console.log(response.data.content.map(a => ({ b: RichText.asHtml(a.body) })));

  // TODO
  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        data: {
          title: response.data.title,
          banner: {
            url: response.data.banner.url,
          },
          author: response.data.author,
          content: response.data.content.map(content => {
            //   // console.log(content.body);
            return {
              heading: content.heading,
              body: RichText.asHtml(content.body),
              //     body: content.body.map(body => {
              //       console.log(body);
              //       // console.log(RichText.asHtml(body.text));
              //       return {
              //         // text: RichText.asHtml(body.text),
              //       };
              //     }),
            };
          }),
        },
      },
    },
    revalidate: 60 * 60 * 24,
  };
};
