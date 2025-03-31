import { supabase } from '@/lib/supabase';
import { uploadFile } from './imageServices';

export const createOrUpdatePost = async (post: any) => {
    try {
        /** Upload image */
        if (post.file && typeof post.file === 'object') {
            let isImage = post?.file?.type === 'image';
            let folderName = isImage ? 'postImages' : 'postVideos';

            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if (fileResult.success) {
                post.file = fileResult.data;
            } else {
                return fileResult;
            }
        }

        // Set default values for scheduled posts
        if (!post.status) {
            post.status = post.is_scheduled ? 'scheduled' : 'published';
        }

        const { data, error } = await supabase.from('posts').upsert(post).select().single();

        if (error) {
            console.log('Create post error >>:', error);
            return { msg: 'Could not create your post', success: false };
        }

        return { data, success: true };
    } catch (error) {
        console.log('Create post error >>:', error);
        return { msg: 'Could not create your post', success: false };
    }
};

export const fetchPosts = async (limit = 10, userId?: string) => {
    try {
        if (userId) {
            const { data, error } = await supabase
                .from('posts')
                .select(`*, user: users (id, name, image), postLikes (*), comments (count)`)
                .order('created_at', { ascending: false })
                .eq('userId', userId)
                .limit(limit);

            if (error) {
                console.log('Fetch posts error >>:', error);
                return { msg: 'Could not fetch the posts', success: false };
            }

            return { data, success: true };
        } else {
            const { data, error } = await supabase
                .from('posts')
                .select(`*, user: users (id, name, image), postLikes (*), comments (count)`)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.log('Fetch posts error >>:', error);
                return { msg: 'Could not fetch the posts', success: false };
            }

            return { data, success: true };
        }
    } catch (error) {
        console.log('Fetch posts error >>:', error);
        return { msg: 'Could not fetch the posts', success: false };
    }
};

export const fetchPostDetails = async (postId: string) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`*, user: users (id, name, image), postLikes (*), comments (*, user: users(id, name, image))`)
            .eq('id', postId)
            .order('created_at', { ascending: false, foreignTable: 'comments' })
            .single();

        if (error) {
            console.log('Fetch post detail error >>:', error);
            return { msg: 'Could not fetch the post detail', success: false };
        }

        return { data, success: true };
    } catch (error) {
        console.log('Fetch post detail error >>:', error);
        return { msg: 'Could not fetch the post detail', success: false };
    }
};

export const createPostLike = async (postLike: any) => {
    try {
        const { data, error } = await supabase.from('postLikes').insert(postLike).select().single();

        if (error) {
            console.log('Post like error >>:', error);
            return { msg: 'Could not create the post like', success: false };
        }

        return { data, success: true };
    } catch (error) {
        console.log('Post like error >>:', error);
        return { msg: 'Could not create the post like', success: false };
    }
};

export const removePostLike = async (postId: string, userId?: string) => {
    try {
        const { error } = await supabase.from('postLikes').delete().eq('userId', userId).eq('postId', postId);

        if (error) {
            console.log('Post like error >>:', error);
            return { msg: 'Could not remove the post like', success: false };
        }

        return { success: true };
    } catch (error) {
        console.log('Post like error >>:', error);
        return { msg: 'Could not remove the post like', success: false };
    }
};

export const createPostComment = async (comment: any) => {
    try {
        const { data, error } = await supabase.from('comments').insert(comment).select().single();

        if (error) {
            console.log('Comment error >>:', error);
            return { msg: 'Could not create comment', success: false };
        }

        return { data, success: true };
    } catch (error) {
        console.log('Post like error >>:', error);
        return { msg: 'Could not create comment', success: false };
    }
};

export const removePostComment = async (commentId: any) => {
    try {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);

        if (error) {
            console.log('Comment error >>:', error);
            return { msg: 'Could not remove the comment', success: false };
        }

        return { success: true };
    } catch (error) {
        console.log('Comment error >>:', error);
        return { msg: 'Could not remove the comment', success: false };
    }
};

export const removePost = async (postId: any) => {
    try {
        const { error } = await supabase.from('posts').delete().eq('id', postId);

        if (error) {
            console.log('Remove post error >>:', error);
            return { msg: 'Could not remove the remove post', success: false };
        }

        return { success: true };
    } catch (error) {
        console.log('Remove error >>:', error);
        return { msg: 'Could not remove the remove post', success: false };
    }
};

export const fetchScheduledPosts = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`*, user: users (id, name, image)`)
            .eq('userId', userId)
            .eq('is_scheduled', true)
            .eq('status', 'scheduled')
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.log('Fetch scheduled posts error >>:', error);
            return { msg: 'Could not fetch scheduled posts', success: false };
        }

        return { data, success: true };
    } catch (error) {
        console.log('Fetch scheduled posts error >>:', error);
        return { msg: 'Could not fetch scheduled posts', success: false };
    }
};

export const updateScheduledPost = async (postId: string, updates: any) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', postId)
            .select()
            .single();

        if (error) {
            console.log('Update scheduled post error >>:', error);
            return { msg: 'Could not update scheduled post', success: false };
        }

        return { data, success: true };
    } catch (error) {
        console.log('Update scheduled post error >>:', error);
        return { msg: 'Could not update scheduled post', success: false };
    }
};

export const cancelScheduledPost = async (postId: string) => {
    try {
        const { error } = await supabase
            .from('posts')
            .update({ 
                is_scheduled: false,
                status: 'draft',
                scheduled_time: null
            })
            .eq('id', postId);

        if (error) {
            console.log('Cancel scheduled post error >>:', error);
            return { msg: 'Could not cancel scheduled post', success: false };
        }

        return { success: true };
    } catch (error) {
        console.log('Cancel scheduled post error >>:', error);
        return { msg: 'Could not cancel scheduled post', success: false };
    }
};
