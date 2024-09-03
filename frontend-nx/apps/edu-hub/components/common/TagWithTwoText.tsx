import { Link, Tooltip } from '@mui/material';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback } from 'react';

interface IPropsTagWithTwoText {
  id?: number;
  textLeft: string;
  textRight?: string | null | undefined;
  textClickLink?: string;
  onRemoveClick?: (id: number) => void;
}

const TagWithTwoText: FC<IPropsTagWithTwoText> = (props) => {
  const onClickRemove = useCallback(() => {
    if (props.onRemoveClick && props.id) {
      props.onRemoveClick(props.id);
    }
  }, [props]);

  const { t } = useTranslation();
  return (
    <div className="flex justify-between rounded-full bg-edu-tag-color px-2 py-1">
      <div className="pr-1 w-full flex justify-between last:mb-0">
        {props.textClickLink && (
          <Link href={props.textClickLink} className="truncate">
            {props.textLeft}
          </Link>
        )}
        {!props.textClickLink && <p className="truncate">{props.textLeft}</p>}

        <div className="flex justify-between">
          {props.textRight && (
            <p className="font-bold pl-2 truncate">{props.textRight}</p>
          )}
          {props.onRemoveClick && (
            <Tooltip title={t('delete')}>
              <p
                onClick={onClickRemove}
                className="text-white ml-2 cursor-pointer"
              >
                x
              </p>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagWithTwoText;
