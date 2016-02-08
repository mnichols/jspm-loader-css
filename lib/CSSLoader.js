import { CSSLoaderBuilded } from './CSSLoaderBuilded';
import { CSSLoaderDOM } from './CSSLoaderDOM';

const LoaderExtention = typeof window === 'undefined' ? CSSLoaderBuilded : CSSLoaderDOM;

export { LoaderExtention as CSSLoader };