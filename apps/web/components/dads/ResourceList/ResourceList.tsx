import type { ComponentProps } from 'react';
import { Slot } from '../Slot';

/**
 * ResourceList component for DADS (Digital Agency Design System)
 * A list component for displaying navigational resources with titles and descriptions.
 */

export type ResourceListProps = ComponentProps<'ul'>;

export const ResourceList = (props: ResourceListProps) => {
  const { className, children, ...rest } = props;

  return (
    <ul
      className={`divide-y divide-solid-gray-300 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </ul>
  );
};

export type ResourceListItemProps = ComponentProps<'li'> & {
  asChild?: boolean;
};

export const ResourceListItem = (props: ResourceListItemProps) => {
  const { asChild, className, children, ...rest } = props;

  const itemClass = `py-4 ${className ?? ''}`;

  if (asChild) {
    return (
      <li className={itemClass}>
        {children}
      </li>
    );
  }

  return (
    <li className={itemClass} {...rest}>
      {children}
    </li>
  );
};

export type ResourceListLinkProps = {
  className?: string;
  children: React.ReactNode;
} & (
  | ({ asChild?: false } & ComponentProps<'a'>)
  | { asChild: true }
);

export const ResourceListLink = (props: ResourceListLinkProps) => {
  const { asChild, className, children, ...rest } = props;

  const linkClass = `
    block
    hover:bg-solid-gray-50
    focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:outline-offset-[calc(2/16*1rem)] focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300
    ${className ?? ''}
  `;

  if (asChild) {
    return (
      <Slot className={linkClass} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <a className={linkClass} {...rest}>
      {children}
    </a>
  );
};

export type ResourceListTitleProps = ComponentProps<'span'>;

export const ResourceListTitle = (props: ResourceListTitleProps) => {
  const { className, children, ...rest } = props;

  return (
    <span
      className={`block text-std-17B-170 text-blue-1000 underline underline-offset-[calc(3/16*1rem)] ${className ?? ''}`}
      {...rest}
    >
      {children}
    </span>
  );
};

export type ResourceListDescriptionProps = ComponentProps<'span'>;

export const ResourceListDescription = (props: ResourceListDescriptionProps) => {
  const { className, children, ...rest } = props;

  return (
    <span
      className={`block mt-1 text-std-16N-170 text-solid-gray-700 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </span>
  );
};

export type ResourceListMetaProps = ComponentProps<'span'>;

export const ResourceListMeta = (props: ResourceListMetaProps) => {
  const { className, children, ...rest } = props;

  return (
    <span
      className={`block mt-1 text-std-14N-170 text-solid-gray-600 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </span>
  );
};
