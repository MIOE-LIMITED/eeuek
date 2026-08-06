'use client';

import { useState } from 'react';
import Link from 'next/link';

function tagClass(g) {
  if (g === 'Haber') return 'ks-tag haber';
  if (g === 'Teknik' || g === 'Servis') return 'ks-tag teknik';
  return 'ks-tag rehber';
}

export default function BlogList({ posts, tabs }) {
  const [tab, setTab] = useState('Tümü');
  const list = posts.filter((p) => tab === 'Tümü' || p.g === tab);
  const feat = list[0];
  const rest = list.slice(1);

  return (
    <div className="ks-page-body">
      <div className="ks-tabs">
        {tabs.map((label) => (
          <button
            type="button"
            key={label}
            className={`ks-tab${label === tab ? ' is-active' : ''}`}
            onClick={() => setTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {feat ? (
        <Link className="ks-blog-feat" href={`/blog/${feat.s}`}>
          <div className="ks-blog-feat-body">
            <div className="ks-blog-feat-meta">
              <span className="k">{feat.g.toUpperCase()}</span>
              <span className="d">
                {feat.date}
                {feat.read ? ` · ${feat.read} DK` : ''}
              </span>
            </div>
            <h2>{feat.t}</h2>
            <p>{feat.ex}</p>
            <span className="ks-readmore">
              DEVAMINI OKU <span>→</span>
            </span>
          </div>
        </Link>
      ) : null}

      <div className="ks-grid-3">
        {rest.map((p) => (
          <Link className="ks-blogcard" href={`/blog/${p.s}`} key={p.s}>
            <div className="ks-blogcard-body">
              <div className="ks-blogcard-meta">
                <span className={tagClass(p.g)}>{p.g.toUpperCase()}</span>
                <span className="d">{p.date}</span>
              </div>
              <h3>{p.t}</h3>
              <p>{p.ex}</p>
              <span className="ks-readmore">
                DEVAMINI OKU <span>→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
