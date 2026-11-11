(function () {
    const config = window.CAFE_SUPABASE_CONFIG || {};
    const hasUrl = Boolean(config.url);
    const hasAnonKey = Boolean(config.anonKey);
    const configured = hasUrl && hasAnonKey;
    let client;
    let sessionPromise;

    function getClient() {
        if (!configured) return null;
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            throw new Error('Supabase SDK did not load. Check your internet connection and reload.');
        }
        if (!client) {
            client = window.supabase.createClient(config.url, config.anonKey);
        }
        return client;
    }

    async function getSession() {
        const supabase = getClient();
        if (!supabase) return null;
        if (!sessionPromise) {
            sessionPromise = (async function () {
                const current = await supabase.auth.getSession();
                if (current.error) throw current.error;
                if (current.data.session) return current.data.session;

                const anonymous = await supabase.auth.signInAnonymously();
                if (anonymous.error) {
                    throw new Error('Could not start a customer session. Enable Anonymous Sign-Ins in Supabase Auth.');
                }
                return anonymous.data.session;
            })().catch(function (error) {
                sessionPromise = null;
                throw error;
            });
        }
        return sessionPromise;
    }

    async function runQuery(query) {
        const result = await query;
        if (result.error) throw result.error;
        return result.data;
    }

    window.CafeBackend = {
        configured: configured,
        configurationIncomplete: hasUrl !== hasAnonKey,
        async getMenu() {
            if (!configured) return null;
            await getSession();
            return runQuery(
                getClient()
                    .from('menu_items')
                    .select('id, name, description, category, price, image_url')
                    .eq('is_available', true)
                    .order('name')
            );
        },
        async getProfile() {
            if (!configured) return null;
            const session = await getSession();
            const rows = await runQuery(
                getClient()
                    .from('profiles')
                    .select('full_name, email, language, dark_mode')
                    .eq('id', session.user.id)
                    .maybeSingle()
            );
            return rows;
        },
        async saveProfile(profile) {
            if (!configured) return false;
            const session = await getSession();
            await runQuery(
                getClient()
                    .from('profiles')
                    .upsert({
                        id: session.user.id,
                        full_name: profile.fullName,
                        email: profile.email || null,
                        language: profile.language,
                        dark_mode: profile.darkMode,
                        updated_at: new Date().toISOString()
                    })
            );
            return true;
        },
        async getOrders() {
            if (!configured) return null;
            const session = await getSession();
            return runQuery(
                getClient()
                    .from('orders')
                    .select('id, order_number, status, payment_method, total, created_at, order_items(item_name, unit_price, quantity)')
                    .eq('customer_id', session.user.id)
                    .order('created_at', { ascending: false })
            );
        },
        async placeOrder(paymentMethod, items) {
            if (!configured) return null;
            await getSession();
            return runQuery(
                getClient().rpc('place_customer_order', {
                    p_payment_method: paymentMethod,
                    p_items: items.map(function (item) {
                        return { product_id: item.id, quantity: item.quantity };
                    })
                })
            );
        },
        async signOut() {
            if (!configured) return;
            const result = await getClient().auth.signOut();
            if (result.error) throw result.error;
            sessionPromise = null;
        }
    };
})();
